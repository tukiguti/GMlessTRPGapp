using UnityEngine;

/// <summary>
/// タワーの種類
/// </summary>
public enum TowerType
{
    OuterTower,     // アウタータワー
    InnerTower,     // インナータワー
    NexusTower,     // ネクサスタワー
    Nexus           // ネクサス
}

/// <summary>
/// レーンの種類
/// </summary>
public enum LaneType
{
    Top,
    Mid,
    Bot
}

/// <summary>
/// チーム（ブルー/レッド）
/// </summary>
public enum Team
{
    Blue,
    Red
}

/// <summary>
/// タワークラス
/// タワーのHP管理、ダメージ処理、破壊判定を行う
/// </summary>
public class Tower : MonoBehaviour
{
    [Header("タワー設定")]
    [SerializeField] private TowerType towerType;
    [SerializeField] private LaneType laneType;
    [SerializeField] private Team team;

    [Header("タワーステータス")]
    [SerializeField] private int maxHP;
    [SerializeField] private int currentHP;
    [SerializeField] private bool isDestroyed = false;

    // タワーの最大HP（タイプ別）
    private static readonly int OUTER_TOWER_HP = 3000;
    private static readonly int INNER_TOWER_HP = 4000;
    private static readonly int NEXUS_TOWER_HP = 5000;
    private static readonly int NEXUS_HP = 5500;

    // ファーム時のタワーダメージ
    public static readonly int FARM_TOWER_DAMAGE = 200;

    void Start()
    {
        InitializeTower();
    }

    /// <summary>
    /// タワーの初期化
    /// </summary>
    private void InitializeTower()
    {
        // タワータイプに応じてHPを設定
        maxHP = GetMaxHPByType(towerType);
        currentHP = maxHP;
        isDestroyed = false;
    }

    /// <summary>
    /// タワータイプに応じた最大HPを取得
    /// </summary>
    private int GetMaxHPByType(TowerType type)
    {
        switch (type)
        {
            case TowerType.OuterTower:
                return OUTER_TOWER_HP;
            case TowerType.InnerTower:
                return INNER_TOWER_HP;
            case TowerType.NexusTower:
                return NEXUS_TOWER_HP;
            case TowerType.Nexus:
                return NEXUS_HP;
            default:
                return OUTER_TOWER_HP;
        }
    }

    /// <summary>
    /// タワーにダメージを与える
    /// </summary>
    /// <param name="damage">ダメージ量</param>
    /// <returns>破壊されたかどうか</returns>
    public bool TakeDamage(int damage)
    {
        if (isDestroyed)
        {
            Debug.LogWarning($"{towerType} on {laneType} lane (Team {team}) is already destroyed!");
            return false;
        }

        currentHP -= damage;
        Debug.Log($"{towerType} on {laneType} lane (Team {team}) took {damage} damage. HP: {currentHP}/{maxHP}");

        if (currentHP <= 0)
        {
            currentHP = 0;
            isDestroyed = true;
            OnTowerDestroyed();
            return true;
        }

        return false;
    }

    /// <summary>
    /// タワーが破壊された時の処理
    /// </summary>
    private void OnTowerDestroyed()
    {
        Debug.Log($"{towerType} on {laneType} lane (Team {team}) has been destroyed!");
        // TODO: タワー破壊時のエフェクト、サウンド、ゴールド報酬など
    }

    /// <summary>
    /// タワーが破壊されているかどうか
    /// </summary>
    public bool IsDestroyed()
    {
        return isDestroyed;
    }

    /// <summary>
    /// 現在のHPを取得
    /// </summary>
    public int GetCurrentHP()
    {
        return currentHP;
    }

    /// <summary>
    /// 最大HPを取得
    /// </summary>
    public int GetMaxHP()
    {
        return maxHP;
    }

    /// <summary>
    /// タワータイプを取得
    /// </summary>
    public TowerType GetTowerType()
    {
        return towerType;
    }

    /// <summary>
    /// レーンタイプを取得
    /// </summary>
    public LaneType GetLaneType()
    {
        return laneType;
    }

    /// <summary>
    /// チームを取得
    /// </summary>
    public Team GetTeam()
    {
        return team;
    }
}
