using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// プレイヤーの行動選択
/// </summary>
public enum PlayerAction
{
    Farm,           // ファーム
    Attack,         // 攻撃
    Gank,           // ガンク
    Recall,         // リコール
    ObjectiveChallenge, // オブジェクト挑戦
    WardPlacement   // ワード配置
}

/// <summary>
/// Laneクラス
/// レーン上のプレイヤー、タワーの管理、マッチアップ判定の処理を行う
/// </summary>
public class Lane : MonoBehaviour
{
    [Header("レーン設定")]
    [SerializeField] private LaneType laneType;

    [Header("タワー参照")]
    [SerializeField] private Tower blueOuterTower;
    [SerializeField] private Tower blueInnerTower;
    [SerializeField] private Tower redOuterTower;
    [SerializeField] private Tower redInnerTower;

    [Header("プレイヤー管理")]
    private List<GameObject> bluePlayersInLane = new List<GameObject>();
    private List<GameObject> redPlayersInLane = new List<GameObject>();

    // ゴールド獲得量の定数
    private const int FARM_GOLD = 100;
    private const int ATTACK_GOLD = 50;

    /// <summary>
    /// レーンタイプを取得
    /// </summary>
    public LaneType GetLaneType()
    {
        return laneType;
    }

    /// <summary>
    /// プレイヤーをレーンに追加
    /// </summary>
    public void AddPlayerToLane(GameObject player, Team team)
    {
        if (team == Team.Blue)
        {
            if (!bluePlayersInLane.Contains(player))
            {
                bluePlayersInLane.Add(player);
                Debug.Log($"Blue player added to {laneType} lane");
            }
        }
        else
        {
            if (!redPlayersInLane.Contains(player))
            {
                redPlayersInLane.Add(player);
                Debug.Log($"Red player added to {laneType} lane");
            }
        }
    }

    /// <summary>
    /// プレイヤーをレーンから削除
    /// </summary>
    public void RemovePlayerFromLane(GameObject player, Team team)
    {
        if (team == Team.Blue)
        {
            bluePlayersInLane.Remove(player);
        }
        else
        {
            redPlayersInLane.Remove(player);
        }
    }

    /// <summary>
    /// レーンをクリア（ターン終了時など）
    /// </summary>
    public void ClearLane()
    {
        bluePlayersInLane.Clear();
        redPlayersInLane.Clear();
    }

    /// <summary>
    /// 対面に敵がいるかチェック
    /// </summary>
    public bool HasEnemyInLane(Team team)
    {
        if (team == Team.Blue)
        {
            return redPlayersInLane.Count > 0;
        }
        else
        {
            return bluePlayersInLane.Count > 0;
        }
    }

    /// <summary>
    /// プレイヤーの行動を処理
    /// </summary>
    /// <param name="player">プレイヤー</param>
    /// <param name="action">行動</param>
    /// <param name="team">チーム</param>
    /// <returns>獲得ゴールド</returns>
    public int ProcessPlayerAction(GameObject player, PlayerAction action, Team team)
    {
        int goldGained = 0;

        switch (action)
        {
            case PlayerAction.Farm:
                goldGained = ProcessFarmAction(team);
                break;

            case PlayerAction.Attack:
                goldGained = ProcessAttackAction(team);
                break;

            // その他の行動は別途実装
            default:
                Debug.Log($"Action {action} not yet implemented");
                break;
        }

        return goldGained;
    }

    /// <summary>
    /// ファーム行動の処理
    /// </summary>
    private int ProcessFarmAction(Team team)
    {
        bool hasEnemy = HasEnemyInLane(team);

        if (!hasEnemy)
        {
            // 対面なし → ゴールド獲得 + タワーへダメージ
            Debug.Log($"{team} team farms in {laneType} lane with no enemy. Gold: {FARM_GOLD}, Tower Damage: {Tower.FARM_TOWER_DAMAGE}");

            // タワーにダメージを与える
            DealDamageToTower(team, Tower.FARM_TOWER_DAMAGE);

            return FARM_GOLD;
        }
        else
        {
            // 対面あり → ゴールド獲得のみ（マッチアップ不参加）
            Debug.Log($"{team} team farms in {laneType} lane (enemy present). Gold: {FARM_GOLD}, No matchup");
            return FARM_GOLD;
        }
    }

    /// <summary>
    /// 攻撃行動の処理
    /// </summary>
    private int ProcessAttackAction(Team team)
    {
        bool hasEnemy = HasEnemyInLane(team);

        if (hasEnemy)
        {
            // 対面あり → マッチアップ判定開始
            Debug.Log($"{team} team attacks in {laneType} lane. Gold: {ATTACK_GOLD}, Matchup started");
            // TODO: マッチアップ判定処理を呼び出す
            return ATTACK_GOLD;
        }
        else
        {
            // 対面なし → ゴールドのみ（タワーダメージなし）
            Debug.Log($"{team} team attacks in {laneType} lane (no enemy). Gold: {ATTACK_GOLD}, No effect");
            return ATTACK_GOLD;
        }
    }

    /// <summary>
    /// タワーにダメージを与える
    /// </summary>
    private void DealDamageToTower(Team attackingTeam, int damage)
    {
        Tower targetTower = null;

        // 攻撃するチームに応じて、敵のタワーを選択
        if (attackingTeam == Team.Blue)
        {
            // ブルーチームが攻撃 → レッドチームのタワー
            targetTower = GetNextTargetTower(Team.Red);
        }
        else
        {
            // レッドチームが攻撃 → ブルーチームのタワー
            targetTower = GetNextTargetTower(Team.Blue);
        }

        if (targetTower != null && !targetTower.IsDestroyed())
        {
            bool destroyed = targetTower.TakeDamage(damage);
            if (destroyed)
            {
                Debug.Log($"{targetTower.GetTowerType()} destroyed in {laneType} lane!");
            }
        }
        else
        {
            Debug.LogWarning($"No valid tower to attack in {laneType} lane for team {attackingTeam}");
        }
    }

    /// <summary>
    /// 次に攻撃可能なタワーを取得
    /// タワー破壊の順序制約を考慮
    /// </summary>
    private Tower GetNextTargetTower(Team targetTeam)
    {
        if (targetTeam == Team.Blue)
        {
            // ブルーチームのタワーを攻撃
            if (!blueOuterTower.IsDestroyed())
            {
                return blueOuterTower;
            }
            else if (!blueInnerTower.IsDestroyed())
            {
                return blueInnerTower;
            }
        }
        else
        {
            // レッドチームのタワーを攻撃
            if (!redOuterTower.IsDestroyed())
            {
                return redOuterTower;
            }
            else if (!redInnerTower.IsDestroyed())
            {
                return redInnerTower;
            }
        }

        return null; // すべて破壊済み
    }

    /// <summary>
    /// レーンのアウタータワーが破壊されているか確認
    /// </summary>
    public bool IsOuterTowerDestroyed(Team team)
    {
        if (team == Team.Blue)
        {
            return blueOuterTower != null && blueOuterTower.IsDestroyed();
        }
        else
        {
            return redOuterTower != null && redOuterTower.IsDestroyed();
        }
    }

    /// <summary>
    /// レーンのインナータワーが破壊されているか確認
    /// </summary>
    public bool IsInnerTowerDestroyed(Team team)
    {
        if (team == Team.Blue)
        {
            return blueInnerTower != null && blueInnerTower.IsDestroyed();
        }
        else
        {
            return redInnerTower != null && redInnerTower.IsDestroyed();
        }
    }
}
